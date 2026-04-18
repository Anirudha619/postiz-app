import {
  AuthTokenDetails,
  PostDetails,
  PostResponse,
  SocialProvider,
} from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { SocialAbstract } from '@gitroom/nestjs-libraries/integrations/social.abstract';
import { Integration } from '@prisma/client';
import { Tool } from '@gitroom/nestjs-libraries/integrations/tool.decorator';

export class TumblrProvider extends SocialAbstract implements SocialProvider {
  identifier = 'tumblr';
  name = 'Tumblr';
  scopes = ['write', 'offline_access'];
  editor = 'normal' as const;
  isBetweenSteps = false;
  oneTimeToken = true;

  maxLength() {
    return 5000;
  }

  async generateAuthUrl() {
    const state = makeId(6);
    const url = `https://www.tumblr.com/oauth2/authorize?client_id=${
      process.env.TUMBLR_CLIENT_ID
    }&response_type=code&scope=${encodeURIComponent(
      this.scopes.join(' '),
    )}&state=${state}&redirect_uri=${encodeURIComponent(
      `${process.env.FRONTEND_URL}/integrations/social/tumblr`,
    )}`;

    return {
      url,
      codeVerifier: makeId(30),
      state,
    };
  }

  async authenticate(params: {
    code: string;
    codeVerifier: string;
    refresh?: string;
  }): Promise<AuthTokenDetails> {
    const form = new FormData();
    form.append('grant_type', 'authorization_code');
    form.append('code', params.code);
    form.append('client_id', process.env.TUMBLR_CLIENT_ID!);
    form.append('client_secret', process.env.TUMBLR_CLIENT_SECRET!);
    form.append(
      'redirect_uri',
      `${process.env.FRONTEND_URL}/integrations/social/tumblr`,
    );

    const tokenResponse = await (
      await this.fetch('https://api.tumblr.com/v2/oauth2/token', {
        method: 'POST',
        body: form,
      })
    ).json();

    const userResponse = await (
      await this.fetch('https://api.tumblr.com/v2/user/info', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      })
    ).json();

    const primaryBlog = userResponse.response?.user?.blogs?.[0];

    return {
      id: `t_${userResponse.response?.user?.name}`,
      name: userResponse.response?.user?.name || 'Tumblr',
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in,
      picture: primaryBlog?.avatar?.[0]?.url || '',
      username: userResponse.response?.user?.name,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokenDetails> {
    const form = new FormData();
    form.append('grant_type', 'refresh_token');
    form.append('refresh_token', refreshToken);
    form.append('client_id', process.env.TUMBLR_CLIENT_ID!);
    form.append('client_secret', process.env.TUMBLR_CLIENT_SECRET!);

    const tokenResponse = await (
      await this.fetch('https://api.tumblr.com/v2/oauth2/token', {
        method: 'POST',
        body: form,
      })
    ).json();

    const userResponse = await (
      await this.fetch('https://api.tumblr.com/v2/user/info', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      })
    ).json();

    const primaryBlog = userResponse.response?.user?.blogs?.[0];

    return {
      id: `t_${userResponse.response?.user?.name}`,
      name: userResponse.response?.user?.name || 'Tumblr',
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in,
      picture: primaryBlog?.avatar?.[0]?.url || '',
      username: userResponse.response?.user?.name,
    };
  }

  @Tool({ description: 'Blogs', dataSchema: [] })
  async blogs(accessToken: string) {
    const response = await this.fetch('https://api.tumblr.com/v2/user/info', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const userResponse = await response.json();
    const blogs = userResponse?.response?.user?.blogs || [];
    return blogs.map((blog: any) => ({
      id: blog.name || blog.uuid,
      name: blog.title || blog.name || 'Untitled Blog',
      username: blog.name || blog.uuid,
      picture: blog.avatar?.[0]?.url || '',
    }));
  }

  async post(
    id: string,
    accessToken: string,
    postDetails: PostDetails[],
    integration: Integration,
  ): Promise<PostResponse[]> {
    const [firstPost] = postDetails;
    const blogName = firstPost.settings?.blog || id.replace('t_', '');

    const content: any[] = [
      {
        type: 'text',
        text: firstPost.message,
      },
    ];

    const mediaFiles: { identifier: string; blob: Blob; filename: string }[] =
      [];

    if (firstPost.media && firstPost.media.length > 0) {
      let mediaIndex = 0;
      for (const media of firstPost.media) {
        const identifier = `media_${mediaIndex}`;
        const isVideo =
          (media.path?.indexOf('.mp4') || -1) > -1 || media.type === 'video';

        if (isVideo) {
          content.push({
            type: 'video',
            media: {
              type: 'video/mp4',
              identifier,
            },
          });
        } else {
          content.push({
            type: 'image',
            media: [
              {
                type: 'image/jpeg',
                identifier,
                width: 500,
                height: 500,
              },
            ],
          });
        }

        const response = await fetch(media.path);
        const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
        const buffer = await response.arrayBuffer();
        const blob = new Blob([buffer], { type: mimeType });
        const extension = isVideo ? '.mp4' : '.jpg';
        const filename = `file_${mediaIndex}${extension}`;
        mediaFiles.push({ identifier, blob, filename });
        mediaIndex++;
      }
    }

    const jsonBody = JSON.stringify({
      content,
      state: 'published',
    });

    const form = new FormData();
    form.append('json', jsonBody);

    for (const file of mediaFiles) {
      form.append(file.identifier, file.blob, file.filename);
    }

    const response = await this.fetch(
      `https://api.tumblr.com/v2/blog/${blogName}.tumblr.com/posts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMsg =
        data?.response?.errors?.[0]?.detail ||
        data?.errors?.[0]?.detail ||
        data?.meta?.msg ||
        `Failed to post to Tumblr: ${response.status}`;
      throw new Error(errorMsg);
    }

    return [
      {
        id: firstPost.id,
        postId: String(data.response?.id),
        releaseURL: `https://${blogName}.tumblr.com/post/${data.response?.id}`,
        status: 'posted',
      },
    ];
  }
}
