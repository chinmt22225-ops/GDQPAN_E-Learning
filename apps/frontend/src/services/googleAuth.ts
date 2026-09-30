export interface GoogleUserData {
  email: string;
  name: string;
  googleId: string;
}

interface InitiateGoogleAuthParams {
  onSuccess: (user: GoogleUserData) => void;
  onError: (errorMessage: string) => void;
  onFallback: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export const initiateGoogleAuth = ({
  onSuccess,
  onError,
  onFallback,
}: InitiateGoogleAuthParams): void => {
  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '224545960658-khrdouahso3ql8pia7ukrhbhabbc3is8.apps.googleusercontent.com';

  // Nếu thư viện Google Identity Services chưa tải hoặc bị chặn bởi trình duyệt
  if (!window.google?.accounts?.oauth2) {
    console.warn('Google Identity Services chưa sẵn sàng, kích hoạt giao diện dự phòng.');
    onFallback();
    return;
  }

  try {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          if (tokenResponse.error === 'popup_closed_by_user') {
            return; // Người dùng chủ động đóng popup
          }
          onError(
            tokenResponse.error_description ||
              tokenResponse.error ||
              'Đăng nhập Google không thành công.'
          );
          return;
        }

        if (!tokenResponse.access_token) {
          onError('Không nhận được mã xác thực từ Google.');
          return;
        }

        try {
          // Lấy thông tin tài khoản đã xác thực trực tiếp từ Google API
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Không thể đồng bộ thông tin tài khoản từ Google.');
          }

          const userInfo = await response.json();

          if (!userInfo.email || !userInfo.sub) {
            throw new Error('Dữ liệu tài khoản Google không hợp lệ.');
          }

          onSuccess({
            email: userInfo.email.toLowerCase(),
            name: userInfo.name || userInfo.email.split('@')[0],
            googleId: userInfo.sub,
          });
        } catch (fetchErr: unknown) {
          onError((fetchErr as Error).message || 'Lỗi kết nối tới dịch vụ Google.');
        }
      },
    });

    // Mở popup tài khoản Google và cho phép chọn tài khoản
    client.requestAccessToken({ prompt: 'select_account' });
  } catch (err: unknown) {
    console.error('Lỗi khởi tạo Google OAuth:', err);
    // Khi gặp lỗi hoặc môi trường không hỗ trợ, chuyển sang modal dự phòng
    onFallback();
  }
};
