import {
  ChatBubbleLeftRightIcon,
  CogIcon,
  GlobeAltIcon,
  LinkIcon,
  UsersIcon,
} from '@heroicons/react/24/solid';
import { IconOpenAI } from '../ui/icons';

const features = [
  {
    title: 'AI-Powered',
    description:
      'ExplainIt is powered by advanced AI technology, allowing it to understand the context of your documentation and provide accurate, relevant answers.',
    icon: <IconOpenAI className="h-5 w-5" />,
  },
  {
    title: 'Interactive',
    description:
      'ExplainIt allows two-way communication with your documentation instead of simply extracting text. You can ask questions, get answers, and even follow up on those answers.',
    icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
  },
  {
    title: 'User-Friendly',
    description:
      'With its intuitive interface, anyone can quickly start using ExplainIt. Provide some example questions to spark conversations and link your documentation',
    icon: <UsersIcon className="h-5 w-5" />,
  },
  {
    title: 'Crawling',
    description:
      "The best part is you don't need to spend more than 5 minutes creating your chatbot. Explain it takes a base url and grabs the content for itself.",
    icon: <GlobeAltIcon className="h-5 w-5" />,
  },
  {
    title: 'Sources included',
    description:
      "We all know ai can sometimes hallucinate a bit, but don't worry, we provide the sources used for the generation so your users can check for themselves.",
    icon: <LinkIcon className="h-5 w-5" />,
  },
  {
    title: 'Customizable',
    description:
      "Add and remove as many sources as you want. Set the chat logo, name and link! It's your chatbot, make it yours.",
    icon: <CogIcon className="h-5 w-5" />,
  },
];

const codeSnippet = `<html>
<head>
    <style>
        .chat-bubble {
            position: fixed;
            bottom: 20px;
            /* You get the picture, I don't mean to bore you with styles ) */
        }
    </style>
</head>
<body>
    <a 
      class="chat-bubble" 
      href="https://explainit.mzslabs.com/chat/{your-id}"
    >
      ExplainIt with AI
    </a>
    <!-- ... -->
</body>
</html>`;

export default function FeaturesSection() {
  return (
    <div
      id="features"
      className="py-16 mt-20 md:py-24 space-y-12 md:space-y-20 px-4 md:px-0"
    >
      <div className="mx-auto max-w-2xl flex flex-col justify-center items-center">
        <h1 className="text-2xl text-center font-semibold sm:text-3xl xl:text-[40px] relative text-gray-900 dark:text-white">
          Features you need
        </h1>
        <p className="mt-6 text-sm md:text-base text-center text-gray-600 dark:text-gray-300">
          Empower your developer community with ExplainIt.
        </p>
      </div>

      <div className="md:px-8 mx-auto place-items-center grid grid-col-1 md:grid-cols-3 gap-10 md:gap-x-4 md:gap-y-4">
        {features.map((f, i) => (
          <div
            className="border bg-white dark:bg-gray-950 dark:border-gray-800 rounded-md p-5 max-w-96 h-full"
            key={i}
          >
            {/* Icon */}
            <div className="mb-4 bg-brand-400 dark:bg-gray-800 h-8 w-8 rounded-full flex items-center justify-center text-white">
              {f.icon}
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {f.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {f.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* <div className="mx-auto max-w-2xl flex flex-col justify-center items-center">
        <h1 className="text-2xl text-center font-semibold sm:text-3xl xl:text-[40px] relative text-gray-900 dark:text-white">
          Connect to your website in an instant
        </h1>
        <p className="mt-6 text-sm md:text-base text-center text-gray-600 dark:text-gray-300">
          Explainit provides the easiest integration possible, copy paste and
          start boosting your community, no dependencies, super lightweight.
        </p>
      </div>
      <div className="max-w-xs sm:max-w-sm md:max-w-4xl mx-auto">
        <SyntaxHighlighter
          language={'html'}
          style={coldarkDark}
          PreTag="div"
          showLineNumbers
          customStyle={{
            margin: 0,
            width: '100%',
            background: '#131316',
            padding: '1.5rem 1rem',
            border: '1px solid #7B39ED',
            borderRadius: '0.5rem',
          }}
          codeTagProps={{
            style: {
              fontSize: '0.9rem',
              fontFamily: 'var(--font-mono)',
            },
          }}
        >
          {codeSnippet}
        </SyntaxHighlighter>
      </div> */}
    </div>
  );
}
