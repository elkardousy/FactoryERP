import { TokenPair } from './token-pair.interface';

export interface LoginResult {
  user: {
    userId: bigint;
    username: string;
    fullName: string;
    roleId: bigint;
  };
  tokens: TokenPair;
}
