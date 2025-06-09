/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['pdf-parse'],
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Handle pdf-parse on server side
            config.externals = config.externals || []
            config.externals.push({
                'pdf-parse': 'commonjs pdf-parse'
            })
        }
        return config
    }
}

module.exports = nextConfig 