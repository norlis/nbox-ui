import {Box, User, CircleArrowOutDownRight} from "lucide-react"
import {Link, NavLink} from "react-router";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "../components/ui/dropdown-menu";
import {useLayout} from "~/layout/layout.context";


interface HeaderProps {
    currentUser?: string
}

type NavItem = {
    title: string
    href: string
}

const navItems: NavItem[] = [
    { title: 'Home', href: '/'},
    { title: 'Templates', href: '/template'},
    { title: 'Entry', href: '/entry'},
]

export function Header({ currentUser = "anonymous" }: HeaderProps) {
    const { navExtra } = useLayout();

    return (
        <header
            className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center space-x-6">
                <Link to="/" className="flex items-center space-x-2" aria-label="nbox — go to home">
                    <Box className="h-6 w-6 text-yellow-500" aria-hidden="true"/>
                    <span className="font-bold text-xl">nbox</span>
                </Link>

                <nav aria-label="Main navigation">
                    <ul className="flex items-center space-x-6 list-none m-0 p-0">
                        {navItems.map(item => (
                            <li key={item.title}>
                                <NavLink
                                    className={({isActive}) =>
                                        `text-slate-300 transition-colors ${isActive ? "px-3 py-1 rounded-md bg-yellow-500 text-slate-900 font-medium" : "hover:text-yellow-500"}`
                                    }
                                    to={item.href}
                                >
                                    {item.title}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            <div className="flex items-center gap-3">
                {navExtra}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="flex items-center text-sm font-medium text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 rounded-md px-2 py-1"
                            aria-label={`User menu: ${currentUser}`}
                        >
                            <User className="h-5 w-5 mr-2" aria-hidden="true"/>
                            {currentUser}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-0">
                        <DropdownMenuItem className="cursor-pointer text-slate-300 hover:bg-slate-700 hover:text-white focus:bg-slate-700 focus:text-white">
                            <CircleArrowOutDownRight className="mr-2 h-4 w-4 text-yellow-500" aria-hidden="true"/>
                            <Link to="/logout" className="text-white">logout</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

        </header>
    )
}
