'use client';

import Image from 'next/image';
import classNames from 'classnames/bind';
import thumbsUpImage from '@/public/assets/thumbs-up-w.svg';
import Button from '@/lib/components/Button';
import { likeGroupAction } from '../../actions';
import styles from './LikeButton.module.css';

const cx = classNames.bind(styles);

const LikeButton = ({
  className,
  groupId,
  likeCount,
}: {
  className?: string;
  groupId: number;
  likeCount: number;
}) => {
  const handleLikeClick = async () => likeGroupAction(groupId);
  return (
    <Button
      type="button"
      className={cx('likeButton', className)}
      onClick={handleLikeClick}
    >
      <Image src={thumbsUpImage} alt="like" width={16} height={16} />{' '}
      {likeCount}
    </Button>
  );
};

export default LikeButton;
