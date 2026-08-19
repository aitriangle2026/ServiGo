import { FcGoogle } from 'react-icons/fc';
import Button from '@/components/common/Button';

/**
 * @param {{ label?: string, onClick: () => void, isLoading?: boolean }} props
 */
export default function GoogleLoginButton({ label = 'Continue with Google', onClick, isLoading = false }) {
  return (
    <Button
      type="button"
      variant="outline"
      fullWidth
      size="lg"
      isLoading={isLoading}
      onClick={onClick}
      className="gap-3 !text-secondary"
    >
      {!isLoading && <FcGoogle size={20} />}
      {label}
    </Button>
  );
}
