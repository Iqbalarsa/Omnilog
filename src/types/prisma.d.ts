declare module "@prisma/client" {
  export class PrismaClient {
    book: any;
    entry: any;
    aiMessage: any;
    userPreference: any;
    $disconnect(): Promise<void>;
    constructor(options?: any);
  }
}
