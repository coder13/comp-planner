import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WcaAuthButton } from './WcaAuthButton';

const user = {
  id: 1,
  name: 'WCA User',
  wca_id: '2020USER01',
};

describe('WcaAuthButton', () => {
  it('starts login when the user is signed out', async () => {
    const onLogin = jest.fn();
    const userEventSetup = userEvent.setup();

    render(
      <WcaAuthButton
        isConfigured
        isLoading={false}
        user={null}
        onLogin={onLogin}
        onLogout={jest.fn()}
      />,
    );

    await userEventSetup.click(
      screen.getByRole('button', { name: /sign in/i }),
    );
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it('shows the account and sign-out action when signed in', async () => {
    const onLogout = jest.fn();
    const userEventSetup = userEvent.setup();

    render(
      <WcaAuthButton
        isConfigured
        isLoading={false}
        user={user}
        onLogin={jest.fn()}
        onLogout={onLogout}
      />,
    );

    expect(screen.getByText('WCA User')).toBeInTheDocument();
    await userEventSetup.click(
      screen.getByRole('button', { name: 'Sign out' }),
    );
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
