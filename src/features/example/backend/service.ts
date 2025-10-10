import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '@/backend/http/error';
import {
  ExampleResponseSchema,
  ExampleTableRowSchema,
  type ExampleResponse,
  type ExampleRow,
} from '@/features/example/backend/schema';
import {
  exampleErrorCodes,
} from '@/features/example/backend/error';

const EXAMPLE_TABLE = 'example';

const fallbackAvatar = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/200/200`;

export const getExampleById = async (
  client: SupabaseClient,
  id: string,
): Promise<ExampleResponse> => {
  const { data, error } = await client
    .from(EXAMPLE_TABLE)
    .select('id, full_name, avatar_url, bio, updated_at')
    .eq('id', id)
    .maybeSingle<ExampleRow>();

  if (error) {
    throw new AppError(
      exampleErrorCodes.fetchError,
      error.message,
      500
    );
  }

  if (!data) {
    throw new AppError(
      exampleErrorCodes.notFound,
      'Example not found',
      404
    );
  }

  const rowParse = ExampleTableRowSchema.safeParse(data);

  if (!rowParse.success) {
    throw new AppError(
      exampleErrorCodes.validationError,
      'Example row failed validation.',
      500,
      rowParse.error.format()
    );
  }

  const mapped = {
    id: rowParse.data.id,
    fullName: rowParse.data.full_name ?? 'Anonymous User',
    avatarUrl:
      rowParse.data.avatar_url ?? fallbackAvatar(rowParse.data.id),
    bio: rowParse.data.bio,
    updatedAt: rowParse.data.updated_at,
  } satisfies ExampleResponse;

  const parsed = ExampleResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    throw new AppError(
      exampleErrorCodes.validationError,
      'Example payload failed validation.',
      500,
      parsed.error.format()
    );
  }

  return parsed.data;
};
