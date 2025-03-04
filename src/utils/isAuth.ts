export const isAuth = () => {
  const token = localStorage.getItem('access_token');
  return !!token;
};