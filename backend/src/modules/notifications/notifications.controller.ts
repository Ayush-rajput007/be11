import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AuthenticatedRequest } from '../../middlewares/auth.js';
import { HttpStatus } from '@be11/shared';
import { Server as SocketServer } from 'socket.io';

let ioInstance: SocketServer | null = null;
const userSocketsMap = new Map<string, string>(); // userId -> socketId

export const setIoInstance = (io: SocketServer) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Listen for register-user event to map userId to socket connection
    socket.on('register-user', (userId: string) => {
      userSocketsMap.set(userId, socket.id);
    });

    socket.on('disconnect', () => {
      // Clean up mapping
      for (const [userId, socketId] of userSocketsMap.entries()) {
        if (socketId === socket.id) {
          userSocketsMap.delete(userId);
          break;
        }
      }
    });
  });
};

export const sendNotification = async (userId: string, data: { title: string; message: string }) => {
  try {
    // Save to DB
    const notification = await prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
      },
    });

    // Emit via Socket.io
    const socketId = userSocketsMap.get(userId);
    if (ioInstance && socketId) {
      ioInstance.to(socketId).emit('notification', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const broadcastMatchUpdate = (matchId: string, action: string, data: any) => {
  try {
    if (ioInstance) {
      ioInstance.emit('match-update', { matchId, action, data });
    }
  } catch (error) {
    console.error('Error broadcasting match update:', error);
  }
};

export const getMyNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Notifications retrieved',
      data: { notifications },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    await prisma.notification.updateMany({
      where: { id: id as string, userId: userId as string },
      data: { read: true },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};
