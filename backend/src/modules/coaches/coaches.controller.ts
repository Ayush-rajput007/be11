import { Request, Response } from 'express';
import { prisma } from '../../config/db.js';

// GET /api/v1/coaches - list approved coaches with filters
export const getCoaches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sport, city, experience, rateRange } = req.query;

    const where: any = {
      status: 'APPROVED',
    };

    if (city) {
      where.city = city as string;
    }

    const coaches = await prisma.coach.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        academy: {
          select: {
            name: true,
            city: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Apply code-level filtering for JSON array queries if needed
    let filteredCoaches = coaches;

    if (sport) {
      filteredCoaches = filteredCoaches.filter((c: any) => {
        try {
          const sportsArr = typeof c.sports === 'string' ? JSON.parse(c.sports) : c.sports;
          return Array.isArray(sportsArr) && sportsArr.includes(sport);
        } catch {
          return false;
        }
      });
    }

    if (experience) {
      const expMin = parseInt(experience as string, 10);
      if (!isNaN(expMin)) {
        filteredCoaches = filteredCoaches.filter((c: any) => c.experienceYears >= expMin);
      }
    }

    if (rateRange) {
      // rateRange: beginner (< 1500), intermediate (1500 - 3000), advanced (> 3000)
      if (rateRange === 'beginner') {
        filteredCoaches = filteredCoaches.filter((c: any) => c.hourlyRate < 1500);
      } else if (rateRange === 'intermediate') {
        filteredCoaches = filteredCoaches.filter((c: any) => c.hourlyRate >= 1500 && c.hourlyRate <= 3000);
      } else if (rateRange === 'advanced') {
        filteredCoaches = filteredCoaches.filter((c: any) => c.hourlyRate > 3000);
      }
    }

    // Map ratings averages
    const result = filteredCoaches.map((c: any) => {
      const reviews = c.reviews || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 5.0;

      return {
        id: c.id,
        name: `Coach ${c.user.firstName} ${c.user.lastName}`,
        email: c.user.email,
        phone: c.user.phone,
        experienceYears: c.experienceYears,
        certifications: typeof c.certifications === 'string' ? JSON.parse(c.certifications) : c.certifications,
        sports: typeof c.sports === 'string' ? JSON.parse(c.sports) : c.sports,
        languages: typeof c.languages === 'string' ? JSON.parse(c.languages) : c.languages,
        city: c.city,
        about: c.about,
        achievements: typeof c.achievements === 'string' ? JSON.parse(c.achievements) : c.achievements,
        gallery: typeof c.gallery === 'string' ? JSON.parse(c.gallery) : c.gallery,
        videos: typeof c.videos === 'string' ? JSON.parse(c.videos) : c.videos,
        trainingStyle: c.trainingStyle,
        hourlyRate: c.hourlyRate,
        academyName: c.academy?.name || 'Independent Freelance Coach',
        avgRating,
        reviewsCount: reviews.length,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Coaches loaded successfully',
      data: { coaches: result },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/coaches/academies - popular academies
export const getAcademies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const academies = await prisma.academy.findMany({
      include: {
        coaches: {
          select: { id: true },
        },
      },
    });

    const result = academies.map((a: any) => ({
      id: a.id,
      name: a.name,
      logo: a.logo,
      city: a.city,
      sports: typeof a.sports === 'string' ? JSON.parse(a.sports) : a.sports,
      rating: a.rating,
      coachesCount: a.coaches.length,
    }));

    res.status(200).json({
      success: true,
      message: 'Academies loaded successfully',
      data: { academies: result },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/coaches/camps - list camps
export const getCamps = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sport, city } = req.query;

    const where: any = {};
    if (sport) {
      where.sport = sport as string;
    }
    if (city) {
      where.city = city as string;
    }

    const camps = await prisma.camp.findMany({
      where,
      include: {
        coach: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        academy: {
          select: { name: true },
        },
      },
    });

    const result = camps.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      sport: c.sport,
      venue: c.venue,
      city: c.city,
      startDate: c.startDate,
      durationWeeks: c.durationWeeks,
      skillLevel: c.skillLevel,
      seatsLimit: c.seatsLimit,
      seatsLeft: c.seatsLeft,
      fee: c.fee,
      timings: c.timings,
      banner: c.banner,
      coachName: `Coach ${c.coach.user.firstName} ${c.coach.user.lastName}`,
      academyName: c.academy?.name || 'be11 Sports Center',
    }));

    res.status(200).json({
      success: true,
      message: 'Camps loaded successfully',
      data: { camps: result },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/coaches/:id - get coach profile details
export const getCoachById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const coach = await prisma.coach.findUnique({
      where: { id },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        academy: true,
        camps: true,
        availabilities: {
          where: { isBooked: false },
        },
        reviews: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found.' });
      return;
    }

    const reviews = coach.reviews || [];
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 5.0;

    const result = {
      id: coach.id,
      name: `Coach ${coach.user.firstName} ${coach.user.lastName}`,
      email: coach.user.email,
      phone: coach.user.phone,
      experienceYears: coach.experienceYears,
      certifications: typeof coach.certifications === 'string' ? JSON.parse(coach.certifications) : coach.certifications,
      sports: typeof coach.sports === 'string' ? JSON.parse(coach.sports) : coach.sports,
      languages: typeof coach.languages === 'string' ? JSON.parse(coach.languages) : coach.languages,
      city: coach.city,
      about: coach.about,
      achievements: typeof coach.achievements === 'string' ? JSON.parse(coach.achievements) : coach.achievements,
      gallery: typeof coach.gallery === 'string' ? JSON.parse(coach.gallery) : coach.gallery,
      videos: typeof coach.videos === 'string' ? JSON.parse(coach.videos) : coach.videos,
      trainingStyle: coach.trainingStyle,
      hourlyRate: coach.hourlyRate,
      academy: coach.academy,
      camps: coach.camps,
      availabilities: coach.availabilities,
      avgRating,
      reviews: reviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        studentName: `${r.user.firstName} ${r.user.lastName}`,
      })),
    };

    res.status(200).json({
      success: true,
      message: 'Coach profile loaded successfully',
      data: { coach: result },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/coaches/apply - apply as coach
export const applyAsCoach = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { experienceYears, certifications, sports, languages, city, about, trainingStyle, hourlyRate, achievements } = req.body;

    // Check if user already has a coach profile
    const existing = await prisma.coach.findUnique({ where: { userId } });
    if (existing) {
      res.status(400).json({ success: false, message: 'You have already submitted a coaching application.' });
      return;
    }

    // Create pending coach profile
    const coach = await prisma.coach.create({
      data: {
        userId,
        experienceYears: parseInt(experienceYears || '1', 10),
        certifications: JSON.stringify(certifications || []),
        sports: JSON.stringify(sports || []),
        languages: JSON.stringify(languages || []),
        city: city || 'Mumbai',
        about: about || '',
        trainingStyle: trainingStyle || 'Personal training',
        hourlyRate: parseFloat(hourlyRate || '1000.0'),
        achievements: JSON.stringify(achievements || []),
        status: 'PENDING',
      },
    });

    // Update user role to COACH
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'COACH' },
    });

    res.status(201).json({
      success: true,
      message: 'Coaching application submitted successfully! Pending admin approval.',
      data: { coach },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/coaches/camps/:id/join - user enrolls in camp
export const joinCamp = async (req: any, res: Response): Promise<void> => {
  try {
    const studentId = req.user.id;
    const id = req.params.id as string;

    const camp = await prisma.camp.findUnique({
      where: { id },
      include: {
        coach: { include: { user: { select: { firstName: true } } } },
      },
    });

    if (!camp) {
      res.status(404).json({ success: false, message: 'Training camp not found.' });
      return;
    }

    if (camp.seatsLeft <= 0) {
      res.status(400).json({ success: false, message: 'This training camp is fully booked!' });
      return;
    }

    // Check if already enrolled
    const existing = await prisma.studentEnrollment.findFirst({
      where: { campId: id, studentId, status: 'CONFIRMED' },
    });
    if (existing) {
      res.status(400).json({ success: false, message: 'You are already enrolled in this camp.' });
      return;
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.walletBalance < camp.fee) {
      res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance. Please add credits to your wallet.',
      });
      return;
    }

    // Perform wallet transaction and seats updates
    await prisma.$transaction([
      prisma.user.update({
        where: { id: studentId },
        data: { walletBalance: student.walletBalance - camp.fee },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: studentId,
          amount: -camp.fee,
          type: 'DEBIT',
          description: `Enrolled in Camp: ${camp.name}`,
        },
      }),
      prisma.camp.update({
        where: { id },
        data: { seatsLeft: camp.seatsLeft - 1 },
      }),
      prisma.studentEnrollment.create({
        data: {
          campId: id,
          studentId,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        },
      }),
      prisma.notification.create({
        data: {
          userId: studentId,
          title: 'Camp Registration Confirmed',
          message: `You have successfully joined ${camp.name}. Starts on ${camp.startDate}.`,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in the training camp!',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/coaches/:id/book - book private 1-to-1 slot
export const bookSession = async (req: any, res: Response): Promise<void> => {
  try {
    const studentId = req.user.id;
    const coachId = req.params.id as string;
    const { date, time, availabilityId } = req.body;

    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found.' });
      return;
    }

    // Verify availability is free
    const avail = await prisma.availability.findFirst({
      where: { id: availabilityId, coachId, isBooked: false },
    });
    if (!avail) {
      res.status(400).json({ success: false, message: 'Selected time slot is no longer available.' });
      return;
    }

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.walletBalance < coach.hourlyRate) {
      res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance. Please add credits to your wallet.',
      });
      return;
    }

    // Book slot
    await prisma.$transaction([
      prisma.user.update({
        where: { id: studentId },
        data: { walletBalance: student.walletBalance - coach.hourlyRate },
      }),
      prisma.walletTransaction.create({
        data: {
          userId: studentId,
          amount: -coach.hourlyRate,
          type: 'DEBIT',
          description: `Booked 1-to-1 with Coach ${coach.user.firstName}`,
        },
      }),
      prisma.availability.update({
        where: { id: availabilityId },
        data: { isBooked: true },
      }),
      prisma.session.create({
        data: {
          coachId,
          studentId,
          type: 'ONE_TO_ONE',
          date,
          time,
          fee: coach.hourlyRate,
          status: 'BOOKED',
        },
      }),
      prisma.notification.create({
        data: {
          userId: studentId,
          title: 'Coaching Session Booked',
          message: `Your session with Coach ${coach.user.firstName} is scheduled for ${date} at ${time}.`,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Coaching session booked successfully!',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/coaches/student/trainings - student training summary
export const getStudentTrainings = async (req: any, res: Response): Promise<void> => {
  try {
    const studentId = req.user.id;

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { studentId },
      include: {
        camp: {
          include: {
            coach: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });

    const sessions = await prisma.session.findMany({
      where: { studentId },
      include: {
        coach: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    const attendances = await prisma.attendance.findMany({
      where: { studentId },
    });

    const certificates = await prisma.certificate.findMany({
      where: { studentId },
      include: {
        coach: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Student trainings retrieved successfully',
      data: { enrollments, sessions, attendances, certificates },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/coaches/coach/dashboard - coach analytics and logs
export const getCoachDashboard = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const coach = await prisma.coach.findUnique({
      where: { userId },
    });

    if (!coach) {
      res.status(403).json({ success: false, message: 'No coach profile linked to this user account.' });
      return;
    }

    const camps = await prisma.camp.findMany({
      where: { coachId: coach.id },
      include: {
        enrollments: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    const sessions = await prisma.session.findMany({
      where: { coachId: coach.id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    const reviews = await prisma.review.findMany({
      where: { coachId: coach.id },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Coach dashboard loaded successfully',
      data: {
        coach,
        camps,
        sessions,
        reviews,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/coaches/dashboard/attendance - submit attendance
export const markAttendance = async (req: any, res: Response): Promise<void> => {
  try {
    const { studentId, campId, sessionId, date, status } = req.body;

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        campId: campId || null,
        sessionId: sessionId || null,
        date,
        status,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Attendance logged successfully',
      data: { attendance },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/coaches/dashboard/camps - coach drafts camp
export const createCamp = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { name, description, sport, venue, city, startDate, durationWeeks, skillLevel, seatsLimit, fee, timings, banner } = req.body;

    const coach = await prisma.coach.findUnique({ where: { userId } });
    if (!coach) {
      res.status(403).json({ success: false, message: 'You must have an approved coach profile.' });
      return;
    }

    const camp = await prisma.camp.create({
      data: {
        coachId: coach.id,
        academyId: coach.academyId,
        name,
        description,
        sport,
        venue,
        city,
        startDate,
        durationWeeks: parseInt(durationWeeks || '4', 10),
        skillLevel,
        seatsLimit: parseInt(seatsLimit || '20', 10),
        seatsLeft: parseInt(seatsLimit || '20', 10),
        fee: parseFloat(fee || '2000.0'),
        timings,
        banner: banner || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Training camp published successfully!',
      data: { camp },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/coaches/dashboard/feedback - submit certs or feedback
export const awardCertificate = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { studentId, title, sport, issueDate, certificateUrl } = req.body;

    const coach = await prisma.coach.findUnique({ where: { userId } });
    if (!coach) {
      res.status(403).json({ success: false, message: 'Must have a valid coach profile.' });
      return;
    }

    const certificate = await prisma.certificate.create({
      data: {
        studentId,
        coachId: coach.id,
        title,
        sport,
        issueDate,
        certificateUrl: certificateUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw7dld1Z2-iX7dO9mXfF01e3Z4mPzD1_p_q7Kx6wJ04d80_4e0_9mXfD',
      },
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: 'New Certificate Awarded!',
        message: `Congratulations! Coach has awarded you the certificate: "${title}" for ${sport}.`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Certificate awarded and notifications dispatched successfully!',
      data: { certificate },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
