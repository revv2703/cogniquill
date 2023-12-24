import { getUserSubscriptionPlan } from "@/lib/stripe"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback } from "./ui/avatar"
import Image from "next/image"
import { Icons } from "./Icons"

interface UserAccountNavProps{
    email: string | undefined
    name: string
    imageUrl: string
}

const UserAccountNav = async ({email, imageUrl, name}: UserAccountNavProps) => {
    const subscriptionPlan = getUserSubscriptionPlan()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className="overflow-visible">
                <Button className="rounded-fulll h-8 w-8 aspect-square bg-slate-500">
                    <Avatar className="relative w-8 h-8">
                        {imageUrl ? (
                            <div className="relative aspect-square h-full w-full">
                                <Image fill src={imageUrl} alt="profile picture" referrerPolicy="no-referrer" />
                            </div>
                        ) : <AvatarFallback>
                                <span className="sr-only">{name}</span>
                                <Icons.user className="h-4 w-4 text-zinc-900" />
                            </AvatarFallback>}
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            {/* 10:14:00 */}
            <DropdownMenuContent></DropdownMenuContent>
        </DropdownMenu>
    )
}

export default UserAccountNav