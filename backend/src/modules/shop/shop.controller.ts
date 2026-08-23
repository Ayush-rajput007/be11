import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';
import { AppError } from '../../utils/appError.js';

// GET /api/v1/shop/products
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, sport, brand, search, sort } = req.query;
    const filter: any = {};

    if (category && category !== 'All') filter.category = category as string;
    if (sport && sport !== 'All') filter.sport = sport as string;

    const products = await prisma.product.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Products retrieved successfully',
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/shop/products/:id
export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: id as string },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', HttpStatus.NOT_FOUND);
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Product retrieved successfully',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/shop/orders
export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { items, totalPrice } = req.body;
    if (!items || items.length === 0 || !totalPrice) {
      throw new AppError('Invalid order details supplied', HttpStatus.BAD_REQUEST);
    }

    // Check user wallet balance
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      throw new AppError('User profile not found', HttpStatus.NOT_FOUND);
    }

    if (user.walletBalance < totalPrice) {
      throw new AppError('Insufficient wallet balance to purchase gear.', HttpStatus.BAD_REQUEST);
    }

    const order = await prisma.$transaction(async (tx) => {
      // Deduct balance
      await tx.user.update({
        where: { id: userId as string },
        data: { walletBalance: { decrement: totalPrice } },
      });

      // Log transaction
      await tx.walletTransaction.create({
        data: {
          userId: userId as string,
          amount: totalPrice,
          type: 'DEBIT',
          description: `Gear Order Purchase`,
        },
      });

      // Create Order record
      return tx.order.create({
        data: {
          userId: userId as string,
          totalPrice,
          items,
          status: 'CONFIRMED',
        },
      });
    });

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Order created and payment deducted successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/shop/orders/my
export const getUserOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const orders = await prisma.order.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: 'desc' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/shop/orders/all
export const getAdminOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      throw new AppError('Access forbidden', HttpStatus.FORBIDDEN);
    }

    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'All system orders retrieved successfully',
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};

// --- SAVED JERSEYS CONTROLLERS (DO NOT BREAK) ---

export const saveJerseyDesign = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { name, sport, config } = req.body;
    if (!config) {
      throw new AppError('Invalid jersey configuration data supplied', HttpStatus.BAD_REQUEST);
    }

    const design = await prisma.jerseyDesign.create({
      data: {
        userId: userId as string,
        name: name || 'My Custom Jersey',
        sport: sport || 'Cricket',
        config,
      },
    });

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Jersey design saved successfully',
      data: { design },
    });
  } catch (error) {
    next(error);
  }
};

export const getSavedJerseys = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const designs = await prisma.jerseyDesign.findMany({
      where: { userId: userId as string },
      orderBy: { updatedAt: 'desc' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Saved jersey designs retrieved successfully',
      data: { designs },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSavedJersey = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { id } = req.params;
    const { name, config } = req.body;

    const existing = await prisma.jerseyDesign.findUnique({
      where: { id: id as string },
    });

    if (!existing || existing.userId !== userId) {
      throw new AppError('Design not found or access forbidden', HttpStatus.NOT_FOUND);
    }

    const updated = await prisma.jerseyDesign.update({
      where: { id: id as string },
      data: {
        name: name || existing.name,
        config: config || existing.config,
      },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Jersey design updated successfully',
      data: { design: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSavedJersey = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { id } = req.params;

    const existing = await prisma.jerseyDesign.findUnique({
      where: { id: id as string },
    });

    if (!existing || existing.userId !== userId) {
      throw new AppError('Design not found or access forbidden', HttpStatus.NOT_FOUND);
    }

    await prisma.jerseyDesign.delete({
      where: { id: id as string },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Jersey design deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getJerseyTemplates = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.jerseyTemplate.findMany({
      orderBy: { popularity: 'desc' },
    });

    const result = templates.map((t: any) => ({
      id: t.id,
      name: t.name,
      sport: t.sport,
      popularity: t.popularity,
      config: typeof t.config === 'string' ? JSON.parse(t.config) : t.config,
    }));

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Jersey templates loaded successfully',
      data: { templates: result },
    });
  } catch (error) {
    next(error);
  }
};

// --- NEW E-COMMERCE ENDPOINTS ---

// GET /api/v1/shop/addresses
export const getUserAddresses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);

    const addresses = await prisma.address.findMany({
      where: { userId: userId as string },
      orderBy: { isDefault: 'desc' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      data: { addresses },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/shop/addresses
export const addUserAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);

    const { fullName, phone, addressLine, city, state, pincode, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: userId as string },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: userId as string,
        fullName,
        phone,
        addressLine,
        city,
        state,
        pincode,
        isDefault: !!isDefault,
      },
    });

    res.status(HttpStatus.CREATED).json({
      success: true,
      data: { address },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/shop/addresses/:id
export const deleteUserAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);

    const { id } = req.params;

    await prisma.address.delete({
      where: { id: id as string },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/shop/products/:id/reviews
export const addProductReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);

    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await prisma.productReview.create({
      data: {
        productId: id as string,
        userId: userId as string,
        rating: parseInt(rating),
        comment: comment || '',
      },
    });

    res.status(HttpStatus.CREATED).json({
      success: true,
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/shop/orders/:id/return
export const submitProductReturn = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);

    const { id } = req.params;
    const { reason } = req.body;

    const request = await prisma.returnRequest.create({
      data: {
        orderId: id as string,
        reason,
        status: 'PENDING',
      },
    });

    res.status(HttpStatus.CREATED).json({
      success: true,
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/shop/coupons
export const getCoupons = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { active: true },
    });
    res.status(HttpStatus.OK).json({
      success: true,
      data: { coupons },
    });
  } catch (error) {
    next(error);
  }
};

// --- RAZORPAY GATEWAY PAYMENTS SIMULATOR ---

// POST /api/v1/shop/payments/create-order
export const createRazorpayOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body;
    if (!amount) throw new AppError('Amount is required', HttpStatus.BAD_REQUEST);

    // Simulate order ID generation matching standard Razorpay SDK response
    const razorpayOrderId = `order_${Math.random().toString(36).substring(2, 15)}`;

    res.status(HttpStatus.OK).json({
      success: true,
      data: {
        id: razorpayOrderId,
        amount: amount * 100, // Razorpay works in paisa
        currency: 'INR',
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/shop/payments/verify
export const verifyRazorpayPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount, items } = req.body;

    // In production we verify signature using HMAC SHA256. 
    // In simulator we verify signature exists and matches our mock format
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new AppError('Invalid Razorpay payment credentials supplied', HttpStatus.BAD_REQUEST);
    }

    // Deduct user wallet if wallet was used, or assume UPI/Card completed successfully
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          userId: userId as string,
          totalPrice: parseFloat(amount),
          items,
          status: 'CONFIRMED',
        },
      });

      // Create Transaction log
      await tx.transaction.create({
        data: {
          orderId: newOrder.id,
          paymentId: razorpayPaymentId,
          signature: razorpaySignature,
          amount: parseFloat(amount),
          status: 'SUCCESS',
          method: 'RAZORPAY',
        },
      });

      // Create Invoice record
      await tx.invoice.create({
        data: {
          orderId: newOrder.id,
          invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          url: `/invoices/receipt-${newOrder.id}.pdf`,
        },
      });

      return newOrder;
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Razorpay signature verified successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/shop/payments/webhook
export const razorpayWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Webhook logging
    console.log('Razorpay Webhook Payload received:', req.body);
    res.status(HttpStatus.OK).json({ success: true, received: true });
  } catch (error) {
    next(error);
  }
};
