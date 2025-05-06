import process from 'node:process';

export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  line: {
    channelID: process.env.LINE_CHANNEL_ID,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    callbackURL: process.env.BACKEND_URL + process.env.LINE_CALLBACK_URI,
    authorizationURL: process.env.LINE_AUTH_URL,
    tokenURL: process.env.LINE_TOKEN_URL,
    verifyURL: process.env.LINE_VERIFY_URL,
  },
  user: {
    resetPasswordURL:
      process.env.FRONTEND_URL + process.env.USER_RESET_PASSWORD_URL,
  },
});

// import {JwtModuleAsyncOptions} from "@nestjs/jwt";
//
// export const jwtConfig:JwtModuleAsyncOptions = {
//   useFactory: ()=>{
//     return {
//       secret: process.env.JWT_SECRET,
//       signOptions: {expiresIn: process.env.JWT_EXPIRED_IN},
//     }
//   }
// }
