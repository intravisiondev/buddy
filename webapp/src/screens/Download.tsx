import { Download as DownloadIcon, Monitor, Apple } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { API_BASE } from '../services/api';

const DOWNLOAD_URL = `${API_BASE}/api/download/desktop`;

export default function Download() {
  const handleDownload = () => {
    window.open(DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
        Download Buddy
      </h1>
      <p className="text-light-text-secondary dark:text-dark-text-secondary mb-8">
        Get the desktop app for macOS and use Buddy with a native experience.
      </p>

      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-button bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
            <Monitor className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Apple className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
              <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                Buddy for macOS
              </span>
            </div>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Universal binary (Apple Silicon & Intel). Notarized for secure installation.
            </p>
            <Button
              onClick={handleDownload}
              icon={<DownloadIcon className="w-5 h-5" />}
            >
              Download Buddy.dmg.zip
            </Button>
          </div>
        </div>
      </Card>

      <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary space-y-2">
        <p>
          <strong>Install:</strong> Open the downloaded zip, then drag Buddy.app to your Applications folder.
        </p>
        <p>
          If you see a security warning, open System Settings → Privacy & Security and choose “Open Anyway” for Buddy.
        </p>
      </div>
    </div>
  );
}
