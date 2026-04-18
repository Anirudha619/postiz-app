'use client';

import {
  PostComment,
  withProvider,
} from '@gitroom/frontend/components/new-launch/providers/high.order.provider';
import { TumblrBlogSelect } from '@gitroom/frontend/components/new-launch/providers/tumblr/tumblr.blog.select';
import { FC } from 'react';
import { TumblrDto } from '@gitroom/nestjs-libraries/dtos/posts/providers-settings/tumblr.dto';

const TumblrComponent: FC = () => {
  return <TumblrBlogSelect name="blog" onChange={() => {}} />;
};

export default withProvider({
  postComment: PostComment.POST,
  minimumCharacters: [],
  comments: false,
  SettingsComponent: TumblrComponent,
  CustomPreviewComponent: undefined,
  dto: TumblrDto,
  checkValidity: undefined,
  maximumCharacters: 5000,
});
