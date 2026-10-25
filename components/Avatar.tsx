export default function Avatar({ uuid, size = 32 }: { uuid: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="avatar" src={`https://mc-heads.net/avatar/${uuid}/${size * 2}`} width={size} height={size} alt="" loading="lazy" />;
}
