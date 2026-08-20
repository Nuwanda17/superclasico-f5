import { SocialApp } from "../../../components/SocialApp";

export default async function MatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <SocialApp slug={slug} />;
}
