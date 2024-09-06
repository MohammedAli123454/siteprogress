// utils/fetchMocName.ts
import { db } from '@/app/configs/db';
import { eq } from 'drizzle-orm';
import { mocDetail } from '@/app/configs/schema';

export const fetchMocName = async (moc: string) => {
  const mocData = await db
    .select({ mocName: mocDetail.mocName })
    .from(mocDetail)
    .where(eq(mocDetail.moc, moc))
    .execute();

  return mocData[0]?.mocName || 'Unknown MOC';
};
