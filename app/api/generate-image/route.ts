import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { prompt, provider, settings } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        let imageUrl: string

        switch (provider) {
            case 'stable-diffusion':
                imageUrl = await generateWithStableDiffusion(prompt, settings)
                break
            case 'openai':
                imageUrl = await generateWithOpenAI(prompt, settings)
                break
            case 'replicate':
                imageUrl = await generateWithReplicate(prompt, settings)
                break
            default:
                return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
        }

        return NextResponse.json({ imageUrl })
    } catch (error) {
        console.error('Image generation error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate image' },
            { status: 500 }
        )
    }
}

async function generateWithStableDiffusion(prompt: string, settings: any): Promise<string> {
    const { stableDiffusionUrl, defaultSize, defaultSteps } = settings

    if (!stableDiffusionUrl) {
        throw new Error('Stable Diffusion URL not configured')
    }

    const [width, height] = defaultSize.split('x').map(Number)

    const response = await fetch(`${stableDiffusionUrl}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            width,
            height,
            steps: defaultSteps,
            cfg_scale: 7,
            sampler_name: 'DPM++ 2M Karras',
        }),
    })

    if (!response.ok) {
        throw new Error(`Stable Diffusion API error: ${response.statusText}`)
    }

    const data = await response.json()
    if (!data.images || data.images.length === 0) {
        throw new Error('No images generated')
    }

    // Return base64 data URL
    return `data:image/png;base64,${data.images[0]}`
}



async function generateWithOpenAI(prompt: string, settings: any): Promise<string> {
    const { openaiApiKey, defaultSize } = settings

    if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
            prompt,
            size: defaultSize === '512x512' ? '512x512' : defaultSize === '1024x1024' ? '1024x1024' : '512x512',
            n: 1,
        }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    if (!data.data || data.data.length === 0) {
        throw new Error('No images generated')
    }

    return data.data[0].url
}

async function generateWithReplicate(prompt: string, settings: any): Promise<string> {
    const { replicateApiKey } = settings

    if (!replicateApiKey) {
        throw new Error('Replicate API key not configured')
    }

    // Start prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${replicateApiKey}`,
        },
        body: JSON.stringify({
            version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4', // Stable Diffusion
            input: {
                prompt,
                width: 512,
                height: 512,
            },
        }),
    })

    if (!response.ok) {
        throw new Error(`Replicate API error: ${response.statusText}`)
    }

    const prediction = await response.json()

    // Poll for completion
    let result = prediction
    while (result.status === 'starting' || result.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 1000))

        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
            headers: {
                'Authorization': `Token ${replicateApiKey}`,
            },
        })

        result = await pollResponse.json()
    }

    if (result.status === 'failed') {
        throw new Error(`Replicate generation failed: ${result.error}`)
    }

    if (!result.output || result.output.length === 0) {
        throw new Error('No images generated')
    }

    return result.output[0]
} 