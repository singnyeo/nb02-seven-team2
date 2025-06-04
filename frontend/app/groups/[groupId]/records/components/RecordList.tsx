'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import classNames from 'classnames/bind';
import { useInView } from 'react-intersection-observer';
import Card from '@/lib/components/Card';
import { EXERCISE_TYPE_MAP, Record } from '@/types/entities';
import placeholderImage from '@/public/assets/placeholder.svg';
import formatTime from '@/lib/formatTime';
import { PaginationQuery } from '@/types/pagination';
import { getRecordsAction } from '../actions';
import styles from './RecordList.module.css';

const cx = classNames.bind(styles);

const RecordItem = ({ record }: { record: Record }) => {
  return (
    <Card className={cx('recordItem')}>
      <Image
        className={cx('image')}
        src={record.photos[0] ?? placeholderImage}
        alt="record image"
        width={352}
        height={206}
      />
      <div className={cx('distance')}>{record.distance}KM</div>
      <div className={cx('footer')}>
        <div className={cx('info')}>
          {formatTime(record.time)} · {EXERCISE_TYPE_MAP[record.exerciseType]}
        </div>
        <div className={cx('author')}>{record.author.nickname}</div>
      </div>
    </Card>
  );
};

const RecordList = ({
  groupId,
  paginationQuery,
  initialValues = [],
  total,
}: {
  groupId: number;
  paginationQuery: PaginationQuery;
  initialValues: Record[];
  total: number;
}) => {
  const [records, setRecords] = useState(initialValues);
  const [page, setPage] = useState(paginationQuery?.page ?? 1);
  const { ref, inView } = useInView({
    threshold: 0.1,
  });

  const loadMore = useCallback(async () => {
    const { data: next } = await getRecordsAction(groupId, {
      ...paginationQuery,
      page: page + 1,
    });
    setRecords((prev) => [...prev, ...next]);
    setPage(page + 1);
  }, [groupId, paginationQuery, page]);

  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);

  useEffect(() => {
    setRecords(initialValues);
    setPage(paginationQuery?.page ?? 1);
  }, [initialValues, paginationQuery]);

  const hasNext = records.length < total;

  return (
    <div className={cx('recordList')}>
      {records.map((record) => (
        <RecordItem key={record.id} record={record} />
      ))}
      {hasNext && <div ref={ref} />}
    </div>
  );
};

export default RecordList;
