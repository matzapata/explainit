import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs/server";
import { CheckIcon } from "@heroicons/react/20/solid";
import { Button } from "@/components/ui/button";
import { paymentsService } from "@/lib/services/payments-service";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import GoProButton from "../billing/go-pro-button";

export default async function PricingSection() {
  const  plans = await paymentsService.getPlans()
  

  return (
    <div className="py-24 sm:py-32" id="pricing">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl flex flex-col justify-center items-center sm:text-center">
          <h1 className="text-2xl text-center font-semibold sm:text-3xl xl:text-[40px] relative text-gray-900 dark:text-white">
            Simple, transparent <span className="text-brand-600">pricing.</span>
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
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 text-center">
            No hidden fees. No credit card required. <br /> Cancel anytime.
          </p>
        </div>

        {/* PRO pricing card */}
        <div className="bg-white dark:bg-gray-950 mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-gray-200 dark:ring-gray-800 sm:mt-20 lg:mx -0 lg:flex lg:max-w-none">
          <div className="p-8 sm:p-10 lg:flex-auto">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {plans.pro.name}
            </h3>
            <p className="mt-6 text-base leading-7 text-gray-600 dark:text-gray-300">
              {plans.pro.description}
            </p>
            <div className="mt-10 flex items-center gap-x-4">
              <h4 className="flex-none text-sm font-semibold leading-6 text-brand-600 dark:text-brand-500">
                What’s included
              </h4>
              <div className="h-px flex-auto bg-gray-100 dark:bg-gray-900" />
            </div>
            <ul
              role="list"
              className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 dark:text-gray-300 sm:grid-cols-2 sm:gap-6"
            >
              {plans.pro.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon
                    className="h-6 w-5 flex-none text-brand-600 dark:text-brand-500"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
              <div className="mx-auto max-w-xs px-8">
                <p className="text-base font-semibold text-gray-600 dark:text-gray-300">
                  Become a pro user
                </p>
                <p className="mt-6 flex items-baseline justify-center gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
                    ${plans.pro.price}
                  </span>
                  <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600 dark:text-gray-300">
                    USD
                  </span>
                </p>

                <GoProButton className="mt-10 block w-full rounded-md bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                  Get access
                </GoProButton>

                <p className="mt-6 text-xs leading-5 text-gray-600 dark:text-gray-300">
                  Invoices and receipts available for easy company reimbursement
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Still access for free */}
        <div className="bg-white dark:bg-gray-950 mx-auto mt-16 p-6 max-w-3xl rounded-3xl ring-1 ring-gray-200 dark:ring-gray-800 sm:mt-20 space-y-4">
          <h1 className="text-brand-600 dark:text-brand-500 font-medium text-lg">
            Get started for free, no credit card required
          </h1>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Start with the free plan and upgrade to pro when you need more
              features.
            </p>
            <RegisterLink postLoginRedirectURL="/app/chat">
              <Button
                variant={"secondary-color"}
                size={"sm"}
                className="space-x-2 mt-4"
              >
                <span>Register</span>
                <ArrowRightIcon className="h-5 w-5" />
              </Button>
            </RegisterLink>
          </div>
        </div>
      </div>
    </div>
  );
}
