'use client'
import React from 'react'
import { Button } from "@/components/ui/button"
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Props = {}

export default function Navbar({}: Props) {
    const router = useRouter()
    const buttonClasses = 'px-3 py-2 text-sm bg-transparent text-black border-none disabled:opacity-50 hover:bg-blue-500 hover:text-white'

    return (
        <div className='flex items-center space-x-2 p-3 px-10'>
            <Link href='/' className='font-semibold text-neutral-700'>Home</Link>
            <div className='flex items-center justify-center space-x-2'>
                <Button onClick={() => router.push('/MocDetail')} variant='secondary' className={buttonClasses}>MOC Detail</Button>
                <Button onClick={() => router.push('/AllMOCJoints')} variant='secondary' className={buttonClasses}>MOC Joints Detail</Button>
                <Button onClick={() => router.push('/OverallJointsSummary')} variant='secondary' className={buttonClasses}>Overall Joints By Sizes</Button>
                <Button onClick={() => router.push('/TotalJointsByMOC')} variant='secondary' className={buttonClasses}>Overall Joints By MOCs</Button>
                <Button onClick={() => router.push('/AllMocMaterials')} variant='secondary' className={buttonClasses}>All MOC Materials</Button>
                <Button onClick={() => router.push('/Scope')} variant='secondary' className={buttonClasses}>Scope</Button>
                <Button onClick={() => router.push('/CarFeatures')} variant='secondary' className={buttonClasses}>Car Features</Button>
                <Button onClick={() => router.push('/EditableTable')} variant='secondary' className={buttonClasses}>Editable Table</Button>
            </div>
        </div>
    )
}
