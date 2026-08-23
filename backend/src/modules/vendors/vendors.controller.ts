import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';
import { AppError } from '../../utils/appError.js';

export const registerVendor = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const {
      businessName,
      ownerName,
      location,
      city,
      pincode,
      businessType,
      gstNumber,
      panNumber,
      pricing,
      amenities,
      availability,
      businessDetails,
      bankingDetails,
      documents
    } = req.body;

    if (!ownerName || !businessType) {
      throw new AppError('Missing required registration parameters', HttpStatus.BAD_REQUEST);
    }

    const vendorReq = await prisma.vendor.create({
      data: {
        userId,
        groundName: businessName || 'Sports Business',
        ownerName,
        location: location || 'Not Specified',
        pricing: pricing ? parseFloat(pricing) : null,
        amenities: amenities || [],
        availability: availability || {},
        businessType: businessType || 'VENUE_OWNER',
        gstNumber: gstNumber || null,
        panNumber: panNumber || null,
        city: city || 'Mumbai',
        pincode: pincode || null,
        businessDetails: businessDetails || {},
        bankingDetails: bankingDetails || {},
        documents: documents || {},
        status: 'PENDING',
      },
    });

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Vendor application submitted successfully',
      data: { vendorRequest: vendorReq },
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorRequests = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      throw new AppError('Access forbidden', HttpStatus.FORBIDDEN);
    }

    const requests = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Vendor requests retrieved successfully',
      data: { requests },
    });
  } catch (error) {
    next(error);
  }
};

export const approveVendorRequest = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const role = req.user?.role;
    const { id } = req.params;
    const { status } = req.body; // APPROVED or REJECTED

    if (role !== 'ADMIN') {
      throw new AppError('Access forbidden', HttpStatus.FORBIDDEN);
    }

    const request = await prisma.vendor.findUnique({
      where: { id: id as string },
    });

    if (!request) {
      throw new AppError('Vendor request not found', HttpStatus.NOT_FOUND);
    }

    const updated = await prisma.vendor.update({
      where: { id: id as string },
      data: { status },
    });

    // If approved, create a new ground automatically if type is VENUE_OWNER
    if (status === 'APPROVED') {
      if (request.businessType === 'VENUE_OWNER') {
        await prisma.ground.create({
          data: {
            name: request.groundName || 'Local Turf Hub',
            description: `Sports turf registered by verified vendor ${request.ownerName}.`,
            location: request.location || 'Local Address',
            city: request.city || 'Mumbai',
            pricePerHour: request.pricing || 1500.0,
            sport: 'Cricket', // Default sport
            amenities: request.amenities as any || [],
            images: ['https://images.unsplash.com/photo-1540747737956-37872f84a62f?auto=format&fit=crop&w=600&q=80'],
            ownerId: request.userId,
            rating: 5.0,
            reviewsCount: 0,
          },
        });
      }

      // Update user role to OWNER
      await prisma.user.update({
        where: { id: request.userId },
        data: { role: 'OWNER' }
      });
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: `Vendor request status updated to ${status}`,
      data: { request: updated },
    });
  } catch (error) {
    next(error);
  }
};
