'use client';

import { FC, useEffect, useState } from 'react';
import { useCustomProviderFunction } from '@gitroom/frontend/components/launches/helpers/use.custom.provider.function';
import { Select } from '@gitroom/react/form/select';
import { useSettings } from '@gitroom/frontend/components/launches/helpers/use.values';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
export const TumblrBlogSelect: FC<{
  name: string;
  onChange: (event: {
    target: {
      value: string;
      name: string;
    };
  }) => void;
}> = (props) => {
  const { onChange, name } = props;
  const t = useT();
  const customFunc = useCustomProviderFunction();
  const [blogs, setBlogs] = useState<any[]>([]);
  const { getValues } = useSettings();
  const [currentBlog, setCurrentBlog] = useState<string | undefined>();
  const onChangeInner = (event: {
    target: {
      value: string;
      name: string;
    };
  }) => {
    setCurrentBlog(event.target.value);
    onChange(event);
  };
  useEffect(() => {
    customFunc.get('blogs').then((data) => setBlogs(data));
    const settings = getValues()[props.name];
    if (settings) {
      setCurrentBlog(settings);
    }
  }, []);
  if (!blogs.length) {
    return null;
  }
  return (
    <Select
      name={name}
      label="Select Blog"
      onChange={onChangeInner}
      value={currentBlog}
    >
      <option value="">{t('select_1', '--Select--')}</option>
      {blogs.map((blog: any) => (
        <option key={blog.id} value={blog.id}>
          {blog.name}
        </option>
      ))}
    </Select>
  );
};
