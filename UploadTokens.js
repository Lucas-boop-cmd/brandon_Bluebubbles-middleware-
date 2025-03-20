import { uploadTokens } from './dataBase.js';

// Example tokens
const accessToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsInVzZXJzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJ3b3JrZmxvd3MucmVhZG9ubHkiXSwiY2xpZW50IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5IiwiY2xpZW50S2V5IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIn0sImlhdCI6MTc0MjQ5MDQyNi4xNDUsImV4cCI6MTc0MjU3NjgyNi4xNDV9.erDapJbZ-BAwH5e-JlniU-PNZdXGi4A3jMEISuhsiSF49A5jfXSQgAjfaDy3Chf1jVJWaIuLUNUqU1JzstH7q7TGIfqJqX-l-6mfM3zEgl_UF0Jt_ytE09AGYoGJrwHvSa_1VEJQ5ciBrp4P_p6hbtl9FeTUqKkHYUUVATE2gujgm3p564qTYG6TVX0hBQcYlaHu1kO6B46bc-hDKzrkiVapIXw0P0J7IZgcAD0CP_QScDnN8gD6VIcSA6x1log1vjXehMKcpuE3lLPeeaEhj9qBOY_UpgjQJlPP0mDJ5ljvosve8wiMCNj6VIR9zrheyT4iN14qyBIz5Mo0ghsaQrLOhPbkcns_V5uRimcn2tyd1ZgHxhQWoGIBnyPfBYtDSUxs7VBASfdl8rj64FwetG3JDdmJcnEZl2fchieatdjgXEHxnIseTJ-7qfMdPxk-Ha3ZTdtBn9KGTl-ADfb0pAKV0WyNHngLPwOv2RkztSN-LA-6jVSan4EvP-V4UMXqRZr5f7pruT3Ox-ZCHto9NJVU0L83nzDVWsL7uNfOORhS_byD2_ZoHmXR_1t1rIS85Ys-rVRfjLxt23Wzv9BAHYbQtIxn3P-MXPqLBfB1yYOAyDOo_y-TySw4Gx_pqWJ9ErkofsCK0mPSpXFGNnwpN59-oQ4EGupVOPZHDL-amu4';
const refreshToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiaDRCV2NoTmR5Nld5a25nMUZmVEgiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnZlcnNhdGlvbnMucmVhZG9ubHkiLCJjb252ZXJzYXRpb25zLndyaXRlIiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLnJlYWRvbmx5IiwiY29udmVyc2F0aW9ucy9tZXNzYWdlLndyaXRlIiwiY29udmVyc2F0aW9ucy9yZXBvcnRzLnJlYWRvbmx5IiwiY29udGFjdHMucmVhZG9ubHkiLCJjb250YWN0cy53cml0ZSIsInVzZXJzLnJlYWRvbmx5IiwidXNlcnMud3JpdGUiLCJ3b3JrZmxvd3MucmVhZG9ubHkiXSwiY2xpZW50IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5IiwiY2xpZW50S2V5IjoiNjdkNDk5YmQzZTRhOGMzMDc2ZDVlMzI5LW04OTlxYjRsIn0sImlhdCI6MTc0MjQ5MDQyNi4xNTIsImV4cCI6MTc3NDAyNjQyNi4xNTIsInVuaXF1ZUlkIjoiYTJkMjQzYjAtMmJmZC00NTRiLWEyNmQtNmE4MDBkYzcyYzNhIn0.GGPHkAuDKwu9O-7DF0AE5wbXKIcom9TkguYUz9px8Fw2hulwCkMxQRTxLtDZaOIiUEGpJsgcDgIgtMiMXlxQHkr9u6okjMDZLNWoAzCdHwp82lXac5LJITVcEjChlC4mYMaPi7d1n1K85raTH0szHYb7EiC6AzqDjaNGn5jYBb4f-Sl2T1VajelrAYapZIb_AkoWGznvucggxUhWct0eJc7t9_aqQnmrIHxWOsldAqJJ6hfFcWpR9LcMVdMhxJXDdj6m095B-2XxLnyPEpInGyxkXSuwHs3fpKk5qyPC9ZPfL-dkaj91AEDXreq23uJBc8HkQqYjAD3LvPBUuqQMq3xic7dqLOzH7k3efoMz8wxLJtjClaTgmTUT3VDsJbfQ4LKmf3n4gjJKBtxkk2uxV9v5C46PXOALKfvLl5BKzzD6rx0ldRbKJlMyNGfDeAKZSvCKvlc3ubcxZo_GIyIr8Z3HJH21zZ7TmqefEmixq7ihCbkLaTGlACKBmeDPaeKxy7cuQXW8Jpvz24Iu3R6qD47xKPt-rUnEpxlK1b-8VWevX9WFosex8aMkWJewZVSH4E5mLMfIeaw7ublvTCO6xwjgXOXA9d1uSu2_uZo0GfRbgp-yXKAZ4KyQodsCSkqeJPV2OUfPN_Ky1RXmGSgpzUQS6KU_llBuUDzGwWxiQ0k';

// Manually upload tokens
const locationId = 'exampleLocationId'; // Replace with actual location ID
uploadTokens(accessToken, refreshToken, locationId);