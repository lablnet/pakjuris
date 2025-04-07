import React, { useState } from 'react';
import Dialog from './Dialog';
import Button from './Button';
import Input from './Input';

interface EditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  title: string;
  label: string;
  initialValue: string;
  placeholder?: string;
  saveLabel?: string;
  cancelLabel?: string;
}

const EditDialog: React.FC<EditDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  label,
  initialValue,
  placeholder = '',
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
}) => {
  const [value, setValue] = useState(initialValue);

  // Reset value when dialog opens with new initialValue
  React.useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim());
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!value.trim()}
          >
            {saveLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label={label}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
      </div>
    </Dialog>
  );
};

export default EditDialog;
