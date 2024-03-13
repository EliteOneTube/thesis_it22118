import { cookies } from 'next/headers'
import { Wp } from '@/types/pages';
import { redirect } from 'next/navigation';
import Link from "next/link";
import WPCard from '@/components/WpCard';

export async function getData() {
    const userCookies = cookies().get('token')

    if (!userCookies) {
        return {
            redirect: {
                destination: '/',
                permanent: true
            }
        }
    }

    const res = await fetch('http://localhost:8080/users/getProfile', {
        headers: {
            authorization: 'Bearer ' + userCookies.value!
        },
        next: {
            revalidate: 0
        }
    }).catch(err => {
        return err.statusText;
    })

    if(!res) {
        redirect('/')
    }

    if (!res.ok) {
        redirect('/')
    }
    
    return await res.json();
}

export default async function Home() {
    const wps: Wp[] = (await getData()).wps;

    return (
        <div className="container mt-8 mx-auto py-8 border border-gray-300 rounded-md shadow-md">
            <div className="flex justify-between mb-4">
                <div></div>
                {/* <Link
                href="/users/insertUser"
                className="mr-8 py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                Insert Wp
                </Link> */}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
                {wps.map((wp) => (
                    <WPCard key={wp._id} wp={wp} />
                ))}
            </div>
        </div>
    );
}
  