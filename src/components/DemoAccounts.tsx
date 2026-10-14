import type { DemoAccountDto, DemoInfoDto } from '../api/types'
import { RoleBadge } from './RoleBadge'
import { UserAvatar } from './UserAvatar'

interface DemoAccountsProps {
  info: DemoInfoDto
  onEnter: (account: DemoAccountDto) => void // sign in as that account
  disabled: boolean // a sign-in is already under way
}

// "Just looking around?": the people of the example organization, each with a button that signs in
// as them with one click. Their accounts are public on purpose (the API publishes them), so there
// is nothing to hide: whoever wants to try the app doesn't need to sign up first.
export function DemoAccounts({ info, onEnter, disabled }: DemoAccountsProps) {
  return (
    <section className="demo-panel" aria-labelledby="demo-title">
      <h2 id="demo-title" className="demo-title">
        Just looking around?
      </h2>
      <p className="demo-text">
        Enter as one of the people of <strong>{info.organizationName}</strong>, an example organization
        with projects and bugs already in it.
      </p>

      <ul className="demo-accounts">
        {info.accounts.map((account) => (
          <li key={account.email} className="demo-account">
            <UserAvatar userId={account.email} size={28} />
            <span className="demo-who">
              <span className="demo-name">{account.displayName}</span>
              <span className="demo-email">{account.email}</span>
            </span>
            <RoleBadge role={account.role} />
            <button
              type="button"
              className="button-ghost"
              aria-label={`Enter as ${account.displayName}`}
              disabled={disabled}
              onClick={() => onEnter(account)}
            >
              Enter
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
