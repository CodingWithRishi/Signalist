import React from 'react'
import Link from "next/link"
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";

const Header = ({user}:{user:User}) => {
    return (
        <header className={"sticky top-0 header"}>
            <div className="container header-wrapper">
                <Link href={"/"}>
                    <Image src={"/assets/icons/logo.svg"} alt={" Signalist logo"}  width={140} height={32} className={"cursor-pointer"}/>
                </Link>
                <nav className="hidden sm:block">

                    {/*nav items */}
                    <NavItems/>
                </nav>

                {/*user dropdown */}
                <UserDropdown user={user} />



            </div>
        </header>
    )
}
export default Header
