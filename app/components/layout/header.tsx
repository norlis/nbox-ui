import {Box, LogOut, User, CircleArrowOutDownRight} from "lucide-react"
import {Link, NavLink} from "react-router";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "~/components/ui/dropdown-menu";


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
    return (
        <header
            className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 flex-shrink-0">
            <nav className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                    <Box className="h-6 w-6 text-yellow-500"/>
                    <span className="font-bold text-xl">nbox</span>
                </div>

                {navItems.map(item => (
                    <NavLink
                        key={item.title}
                        className={({isActive}) =>
                            `text-slate-300  transition-colors ${isActive ? "px-3 py-1 rounded-md bg-yellow-500 text-slate-900 font-medium" : "hover:text-yellow-500"}`
                        }
                        to={item.href}
                    >
                        {item.title}
                    </NavLink>
                ))}
            </nav>

            <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <span  className="flex items-center text-sm font-medium">
                            <User className="h-5 w-5 mr-2"/>
                            {currentUser}
                        </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-0">
                        <DropdownMenuItem className="cursor-pointer text-slate-300 hover:bg-slate-700 hover:text-white focus:bg-slate-700 focus:text-white">
                            <CircleArrowOutDownRight className="mr-2 h-4 w-4 text-yellow-500"/>
                            <Link to="/logout" className="text-white">logout</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

        </header>
    )
}