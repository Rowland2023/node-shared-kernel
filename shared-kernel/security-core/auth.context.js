// /shared/security-core/authContext.js
import { AsyncLocalStorage } from 'async_hooks';

const authContext = new AsyncLocalStorage();

export function runWithUserContext(user, fn) {
  return authContext.run(user, fn);
}

export function getUserContext() {
  return authContext.getStore();
}
