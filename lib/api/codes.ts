export const ApiCode = {
  SUCCESS: 0,
  BAD_REQUEST: 40000,
  NOT_FOUND: 40400,
  FORBIDDEN: 40300,
  PAYLOAD_TOO_LARGE: 41300,
  UNSUPPORTED_TYPE: 41500,
  INTERNAL: 50000,
} as const;

export type ApiCodeValue = (typeof ApiCode)[keyof typeof ApiCode];
