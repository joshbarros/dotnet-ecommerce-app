import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiService } from './api.service';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const api = inject(ApiService);
  const token = api.csrfToken();
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const clone = isWrite && token ? req.clone({ setHeaders: { 'X-CSRF-TOKEN': token } }) : req;
  return next(clone);
};
