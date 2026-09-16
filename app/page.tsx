const YT = {
  featured: "pDoqCbzq4AI",
  works: ["pDoqCbzq4AI", "eVXfIjVjnc0", "VIDEO_ID_3"], // ここは増やしてOK
};

function YouTubeEmbed({ id }: { id: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
 
export default function Home() {
  const name = "CHRIS";
  const tagline = "Composer / Producer"; // 好きな肩書きに変更OK
  const email = "killcount412@gmail.com"; // 自分の連絡先に差し替え
  const youtubeChannelUrl = "https://www.youtube.com/@shota_christopher_ohyama"; // チャンネルURLに差し替え

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
        <p className="text-lg text-neutral-600">{tagline}</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={youtubeChannelUrl}
            className="rounded-lg bg-black px-4 py-2 text-white"
            target="_blank"
            rel="noreferrer"
          >
            YouTube
          </a>
          <a href="#contact" className="rounded-lg border px-4 py-2">
            Contact
          </a>
        </div>
      </header>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold">Featured</h2>
        <YouTubeEmbed id={YT.featured} />
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold">Works</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {YT.works.map((id) => (
            <YouTubeEmbed key={id} id={id} />
          ))}
        </div>
      </section>

      <section id="contact" className="mt-12 space-y-3">
        <h2 className="text-xl font-semibold">Contact</h2>
        <a className="underline" href={`mailto:${email}`}>
          {email}
        </a>
      </section>

      <footer className="mt-16 text-sm text-neutral-500">
        © {new Date().getFullYear()} {name}
      </footer>
    </main>
  );
}