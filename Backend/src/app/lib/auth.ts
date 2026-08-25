import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { envVars } from "../config/env";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { bearer, emailOTP } from "better-auth/plugins";
import { sendEmail } from "../utils/email";

const isProduction = envVars.NODE_ENV === 'production';
export const auth = betterAuth({
  secret: envVars.BETTER_AUTH_SECRET,
  baseURL: envVars.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignIn: true,
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type === 'email-verification') {
          const user = await prisma.user.findUnique({
            where: {
              email,
            }
          });
          if (!user) {
            console.error(`User with Email ${email} not found. cannot send verification OTP`);
            return;
          }

          if (user.role === Role.ADMIN) {
            console.log(`User with Email ${email} is a Super Admin, Skipping sending verification OTP`);
            return;
          }

          if (!user.emailVerified) {
            await sendEmail({
              to: email,
              subject: "Email Verification",
              templateName: "otp",
              templateData: {
                name: user.name,
                otp: otp
              }
            });
          }
        }
      },
      expiresIn: 2 * 60,
      otpLength: 6,
    })
  ],

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: Role.USER
      },
      status: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE
      },
      isDeleted: {
        type: "boolean",
        required: true,
        defaultValue: false
      },
      deletedAt: {
        type: "date",
        required: false,
        defaultValue: null
      }
    }
  },

  session: {
    expiresIn: 60 * 60 * 24, // 1 day in seconds
    updateAge: 60 * 60 * 24, // 1 day in seconds
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24, // 1 day in seconds
    }
  },
  advanced: {
    useSecureCookies: false,
    cookies: {
      state: {
        attributes: {
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          httpOnly: true,
          path: "/"
        }
      },
      sessionToken: {
        attributes: {
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          httpOnly: true,
          path: "/",
        }
      }

    }
  },

});