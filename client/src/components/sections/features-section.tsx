import { ChatBubbleLeftRightIcon, UsersIcon } from "@heroicons/react/24/solid";
import { IconOpenAI } from "../ui/icons";

const features =    [
  {
    title: 'AI-Powered',
    description:
      'ChatWith is powered by advanced AI technology, allowing it to understand the context of your PDF and provide accurate, relevant answers.',
    icon: <IconOpenAI className="h-5 w-5" />,
  },
  {
    title: 'Interactive',
    description:
      "ChatWith allows two-way communication with your PDF instead of simply extracting text. You can ask questions, get answers, and even follow up on those answers. It's like having a conversation with the author of your PDF document.",
    icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
  },
  {
    title: 'User-Friendly',
    description:
      "With its intuitive interface, anyone can quickly start using ChatWith. You don't need any special skills or knowledge to use ChatWith. If you can chat with a friend, you can chat with a PDF.",
    icon: <UsersIcon  className="h-5 w-5" />,
  },
]

export default function FeaturesSection() {
  return (
    <div
      id="features"
      className="py-16 mt-20 md:py-24 space-y-12 md:space-y-16"
    >
      <div className="mx-auto max-w-2xl flex flex-col justify-center items-center">
        <h1 className="text-2xl text-center font-semibold sm:text-3xl xl:text-[40px] relative text-gray-900 dark:text-white">
          Explore key <span className="text-brand-600">features.</span>
          <svg
            width="100"
            height="29"
            viewBox="0 0 307 29"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute -bottom-7 right-0"
          >
            <path
              d="M213.014 26.8415C178.272 19.4138 139.489 23.4441 104.338 24.1263C94.2307 24.3226 83.8895 25.6318 73.7918 25.0712C72.4748 24.9984 66.7288 24.7252 65.6509 23.2654C65.5102 23.0755 69.9908 22.3264 72.1676 22.006C76.4002 21.3829 80.6309 20.9232 84.86 20.2652C95.9785 18.5363 107.291 17.6927 118.507 16.9156C147.298 14.9223 198.803 8.77966 226.942 17.4422C228.336 17.8714 224.026 17.3684 222.568 17.3285C220.172 17.2635 217.778 17.1695 215.381 17.0942C207.566 16.8496 199.685 16.4146 191.869 16.483C166.68 16.702 141.403 15.6497 116.221 16.5922C108.643 16.8762 101.09 17.4658 93.5093 17.6937C89.1182 17.8256 89.315 17.9373 84.7768 17.7833C82.8091 17.7163 77.3531 18.3084 78.9093 17.1021C81.6501 14.9769 90.2167 15.5085 93.5299 15.0749C108.658 13.0974 123.749 10.515 138.954 9.1276C177.942 5.57026 217.632 5.56189 256.709 7.05018C272.694 7.65899 288.845 5.30402 304.762 7.20672C266.14 2.21866 225.996 2.92687 187.163 3.07107C143.44 3.23349 99.7666 3.24431 56.043 4.16564C38.0928 4.54362 20.5048 7.96207 2.5 7.71255"
              stroke="#7B39ED"
              strokeWidth="4.05049"
              strokeMiterlimit="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </h1>
        <p className="mt-6 text-lg text-center text-gray-600 dark:text-gray-300">
          Elevate Your Document Experience with Chatwith. Explore the features we have to offer.
        </p>
      </div>

      <div className="px-4 md:px-8 mx-auto place-items-center grid grid-col-1 md:grid-cols-3 gap-10 md:gap-x-4 md:gap-y-4">
        {features.map((f, i) => (
          <div className="border bg-white dark:bg-gray-950 dark:border-gray-800 rounded-md p-5 max-w-96 h-full" key={i}>
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
    </div>
  );
}
