import { MimeType } from "@/lib/services/chat-service";
import { IconCsvFile, IconFile, IconPdfIcon, IconTxtFile } from "@/components/ui/icons";


interface FileIconProps extends React.SVGProps<SVGSVGElement> {
    mimetype: MimeType | string
}

export default function FileIcon({ mimetype, ...props }: FileIconProps) {
    if (mimetype === MimeType.pdf) {
        return <IconPdfIcon {...props }/>
    } else if (mimetype === MimeType.text) {
        return <IconTxtFile {...props }/>
    } else if (mimetype === MimeType.json) {
        return <IconTxtFile {...props }/>
    } else if (mimetype === MimeType.csv) {
        return <IconCsvFile {...props }/>
    } else return <IconFile {...props }/> 
}