import { SetMetadata } from '@nestjs/common';
export const PLATFORM_ENDPOINT_KEY = 'platformEndpoint';
export const PlatformEndpoint = () => SetMetadata(PLATFORM_ENDPOINT_KEY, true);
export const SKIP_TENANT_KEY = 'skipTenant';
export const SkipTenant = () => SetMetadata(SKIP_TENANT_KEY, true);
