import { buildConfig } from 'payload/config'
import { viteBundler } from '@payloadcms/bundler-vite';
import { slateEditor } from '@payloadcms/richtext-slate';
import { mongooseAdapter } from '@payloadcms/db-mongodb';

export default buildConfig({
    db: mongooseAdapter({
        url: process.env.DATABASE_URI!,
    }),
    admin: {
        bundler: viteBundler(),
    }, 
    editor: slateEditor({}) 
})