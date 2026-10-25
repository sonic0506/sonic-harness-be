export const COMMON_CODE_GROUPS = ['PRODUCT_TYPE', 'PRODUCT_CATEGORY'] as const;

export type CommonCodeGroup = (typeof COMMON_CODE_GROUPS)[number];
