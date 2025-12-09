
export const CAIXA_API_URL = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil';
export const CAIXA_URL = 'https://loterias.caixa.gov.br/paginas/lotofacil.aspx';
export const YOUTUBE_LIVE_URL = 'https://www.youtube.com/@redetv/streams';

export const ADMIN_PASSWORD = '975310voltareijj@';
export const RECOVERY_PHONE = '19996061730';

// Definition of Secret Groups (Reference for AI)
// Group A (15 numbers)
export const SECRET_GROUP_A = [2, 3, 5, 6, 8, 9, 12, 13, 15, 16, 18, 19, 22, 23, 25];

// Group B (10 numbers)
export const SECRET_GROUP_B = [1, 4, 7, 10, 11, 14, 17, 20, 21, 24];

// NEW EXTRA GROUPS (Refinement Layers - Updated by User Request)
export const SECRET_GROUP_C = [1, 3, 6, 8, 11, 13, 16, 18, 21, 23];
export const SECRET_GROUP_D = [1, 4, 6, 9, 11, 14, 16, 19, 21, 24];
export const SECRET_GROUP_E = [2, 4, 7, 9, 12, 14, 17, 19, 22, 24];
export const SECRET_GROUP_F = [2, 5, 7, 10, 12, 15, 17, 20, 22, 25];
export const SECRET_GROUP_G = [3, 5, 8, 10, 13, 15, 18, 20, 23, 25];

// NEW SUPER EXTRA GROUPS (Added Layer 3)
export const SECRET_GROUP_A1 = [1, 2, 4, 6, 8, 9, 11, 13, 15, 16, 18, 20, 22, 23, 25];
export const SECRET_GROUP_B2 = [1, 3, 4, 6, 8, 10, 11, 13, 15, 17, 18, 20, 22, 24, 25];
export const SECRET_GROUP_C3 = [1, 3, 5, 6, 8, 10, 12, 13, 15, 17, 19, 20, 22, 24];
export const SECRET_GROUP_D4 = [1, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19, 21, 22, 24];
export const SECRET_GROUP_E5 = [2, 3, 5, 7, 9, 10, 12, 14, 16, 17, 19, 21, 23, 24];
export const SECRET_GROUP_F6 = [2, 4, 5, 7, 9, 11, 12, 14, 16, 18, 19, 21, 23, 25];
export const SECRET_GROUP_G7 = [2, 4, 6, 7, 9, 11, 13, 14, 16, 18, 20, 21, 23, 25];

export const ALL_GROUPS_AUDIT = [
    { name: 'Grupo A (Ouro)', nums: SECRET_GROUP_A },
    { name: 'Grupo B (Prata)', nums: SECRET_GROUP_B },
    { name: 'Grupo C', nums: SECRET_GROUP_C },
    { name: 'Grupo D', nums: SECRET_GROUP_D },
    { name: 'Grupo E', nums: SECRET_GROUP_E },
    { name: 'Grupo F', nums: SECRET_GROUP_F },
    { name: 'Grupo G', nums: SECRET_GROUP_G },
    { name: 'Grupo A1', nums: SECRET_GROUP_A1 },
    { name: 'Grupo B2', nums: SECRET_GROUP_B2 },
    { name: 'Grupo C3', nums: SECRET_GROUP_C3 },
    { name: 'Grupo D4', nums: SECRET_GROUP_D4 },
    { name: 'Grupo E5', nums: SECRET_GROUP_E5 },
    { name: 'Grupo F6', nums: SECRET_GROUP_F6 },
    { name: 'Grupo G7', nums: SECRET_GROUP_G7 },
];