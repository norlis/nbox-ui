export type Box = {
    service: string
    stage: {
        [environment: string]: {
            template: {
                name: string
                value: string
            }
        }
    }
}
