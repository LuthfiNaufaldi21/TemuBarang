import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

const GUIDE_CARDS = [
  {
    title: "Report Lost Item",
    description:
      "Use this feature when you lose an item. Add clear item details, last known location, date, and photo if available.",
  },
  {
    title: "Report Found Item",
    description:
      "Use this feature when you find someone else's item. Describe where you found it and explain where the item is deposited in the description.",
  },
  {
    title: "Review Match",
    description:
      "Check possible matches between your lost item report and found item reports submitted by other users.",
  },
  {
    title: "Private Chat",
    description:
      "Use chat to confirm item details safely without exposing personal contact information publicly.",
  },
];

const FAQ_ITEMS = [
  {
    question: "What should I do if I lose an item?",
    answer:
      "Create a lost item report, fill in the item name, category, last known location, date, description, and upload a photo if available.",
  },
  {
    question: "What should I do if I find an item?",
    answer:
      "Create a found item report, describe the item clearly, write where it was found, and mention where the item is deposited in the description field.",
  },
  {
    question: "Can I contact the item owner directly?",
    answer:
      "You can use the private chat feature inside TemuBarang. This keeps communication contextual and avoids exposing personal contact information.",
  },
  {
    question: "Who can delete inappropriate reports?",
    answer:
      "Admin users can moderate reports, mark reports as resolved, or delete inappropriate reports through the Admin Dashboard.",
  },
];

export default function HelpCenter() {
  return (
    <div className="flex h-screen bg-[#0E1511] text-white overflow-hidden selection:bg-[#164A41] selection:text-white">
      <Sidebar activePage="help" />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <section className="bg-[#164A41]/40 border border-[#4D774E]/20 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -top-24 -right-20 w-64 h-64 bg-[#164A41] rounded-full blur-2xl opacity-60" />

              <div className="relative z-10">
                <p className="text-[#9CC88D] text-sm font-bold uppercase tracking-[0.2em] mb-3">
                  Support Center
                </p>

                <h1 className="text-[#E2E3DD] text-3xl md:text-4xl font-bold mb-3">
                  Help Center
                </h1>

                <p className="text-[#C2C9BD] text-base md:text-lg max-w-2xl">
                  Learn how to use TemuBarang to report lost items, submit found
                  items, review possible matches, and communicate safely.
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GUIDE_CARDS.map((item) => (
                <article
                  key={item.title}
                  className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#164A41] border border-[#3C4A42] flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-[#9CC88D]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17z"
                      />
                    </svg>
                  </div>

                  <h2 className="text-[#DDE4DD] text-xl font-bold mb-2">
                    {item.title}
                  </h2>

                  <p className="text-[#86948A] text-sm leading-relaxed">
                    {item.description}
                  </p>
                </article>
              ))}
            </section>

            <section className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
              <h2 className="text-[#DDE4DD] text-xl font-bold mb-1">
                Frequently Asked Questions
              </h2>

              <p className="text-[#86948A] text-sm mb-6">
                Common questions about using TemuBarang.
              </p>

              <div className="flex flex-col gap-4">
                {FAQ_ITEMS.map((item) => (
                  <div
                    key={item.question}
                    className="bg-[#0E1511] border border-[#3C4A42]/60 rounded-xl p-5"
                  >
                    <h3 className="text-[#DDE4DD] font-bold mb-2">
                      {item.question}
                    </h3>

                    <p className="text-[#86948A] text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-[#1A211D] border border-[#3C4A42]/50 rounded-2xl p-6">
              <h2 className="text-[#DDE4DD] text-xl font-bold mb-1">
                Safety Tips
              </h2>

              <p className="text-[#86948A] text-sm mb-5">
                Follow these tips when returning or claiming an item.
              </p>

              <ul className="flex flex-col gap-3 text-[#C2C9BD] text-sm">
                <li className="flex gap-3">
                  <span className="text-[#9CC88D] font-bold">01.</span>
                  Do not share sensitive personal information in public report
                  descriptions.
                </li>

                <li className="flex gap-3">
                  <span className="text-[#9CC88D] font-bold">02.</span>
                  Use private chat to confirm specific item details before
                  returning the item.
                </li>

                <li className="flex gap-3">
                  <span className="text-[#9CC88D] font-bold">03.</span>
                  For found items, deposit the item at a safe campus location
                  such as a security post or faculty office.
                </li>

                <li className="flex gap-3">
                  <span className="text-[#9CC88D] font-bold">04.</span>
                  Mark the report as resolved after the item has been returned
                  to its owner.
                </li>
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}