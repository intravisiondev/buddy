import { useState } from 'react';
import { X, UserPlus, Loader } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    email: string;
    password: string;
    name: string;
    age: number;
  }) => Promise<void>;
}

export default function AddChildModal({ isOpen, onClose, onSubmit }: AddChildModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim() || !formData.name.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    if (formData.age < 1 || formData.age > 100) {
      alert('Please enter a valid age.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        email: '',
        password: '',
        name: '',
        age: 10,
      });
      onClose();
    } catch (error: any) {
      alert('Failed to add child: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Student" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            Name *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Student's full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            Email *
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="student@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            Password *
          </label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="At least 6 characters"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            Age *
          </label>
          <Input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 10 })}
            min="1"
            max="100"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Student
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
