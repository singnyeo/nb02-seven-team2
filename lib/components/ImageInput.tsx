'use client';

import { useRef } from 'react';
import classNames from 'classnames/bind';
import { uploadImage } from '@/lib/api';
import styles from './ImageInput.module.css';
import Button from './Button';
import Image from 'next/image';
import closeImage from '@/public/assets/close.svg';

const cx = classNames.bind(styles);

const ImageInput = ({
  className,
  maxCount = 1,
  values = [],
  onChange,
}: {
  className?: string;
  maxCount?: number;
  values: string[];
  onChange: (urls: string[]) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: File[]) => {
    const { urls } = await uploadImage(files);
    onChange(urls);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(Array.from(files).slice(0, maxCount));
    }
  };

  const handleFileClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      onChange([]);
    }
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const isUploaded = values.length > 0;
  const previewStyle = isUploaded
    ? { backgroundImage: `url(${values[0]})` }
    : {};

  const handleRemoveClick = () => {
    handleFileClear();
  };

  return (
    <div className={cx('container', className)} style={previewStyle}>
      <input
        type="file"
        className={cx('hiddenInput')}
        ref={inputRef}
        onChange={handleFileChange}
        multiple={maxCount > 1}
        accept="image/*"
      />
      <div className={cx('overlay')}>
        {isUploaded ? (
          <Image
            className={cx('removeButton')}
            src={closeImage}
            alt="제거"
            width={28}
            height={28}
            onClick={handleRemoveClick}
          />
        ) : (
          <Button
            type="button"
            appearance="minimal"
            onClick={handleUploadClick}
          >
            + 업로드
          </Button>
        )}
      </div>
    </div>
  );
};

export default ImageInput;
