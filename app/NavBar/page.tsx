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
                {/* <Button onClick={() => router.push('/TotalJointsByMOC')} variant='secondary' className={buttonClasses}>Overall Joints By MOCs</Button> */}
                <Button onClick={() => router.push('/AllMocMaterials')} variant='secondary' className={buttonClasses}>All MOC Materials</Button>
                <Button onClick={() => router.push('/Scope')} variant='secondary' className={buttonClasses}>Scope</Button>
                {/* <Button onClick={() => router.push('/CarFeatures')} variant='secondary' className={buttonClasses}>Car Features</Button> */}
                {/* <Button onClick={() => router.push('/EditableTable')} variant='secondary' className={buttonClasses}>Editable Table</Button> */}
                {/* <Button onClick={() => router.push('/PushData')} variant='secondary' className={buttonClasses}>Push Json Data</Button>
                <Button onClick={() => router.push('/PushCounties')} variant='secondary' className={buttonClasses}>Push Countries</Button> */}
                <Button onClick={() => router.push('/FileUploader')} variant='secondary' className={buttonClasses}>Upload Drawings</Button>
                <Button onClick={() => router.push('/FileGetter')} variant='secondary' className={buttonClasses}>Show Drawings</Button>
                <Button onClick={() => router.push('/FileDelete')} variant='secondary' className={buttonClasses}>Delete Files</Button>
                {/* <Button onClick={() => router.push('/InvoiceComponent')} variant='secondary' className={buttonClasses}>Create Invoice</Button> */}
                <Button onClick={() => router.push('/AddJointsDetail')} variant='secondary' className={buttonClasses}>Add Joints To MOC</Button>
                <Button onClick={() => router.push('/AddMocDetail')} variant='secondary' className={buttonClasses}>Add New Awarded Moc</Button>
                <Button onClick={() => router.push('/stepperForm')} variant='secondary' className={buttonClasses}>S.Form</Button>

                <Button onClick={() => router.push('/Rnd')} variant='secondary' className={buttonClasses}>RND</Button>
                <Button onClick={() => router.push('/Rnd1')} variant='secondary' className={buttonClasses}>RND1</Button>
                <Button onClick={() => router.push('/Rnd2')} variant='secondary' className={buttonClasses}>RND2</Button>
            </div>
        </div>
    )
}
