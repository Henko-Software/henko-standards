import { demo } from 'data/demo'

type Props = { label: string }

const Good = ({ label }: Props) => (
	<div className='bg-accent text-muted'>
		{label} · {demo.length}
	</div>
)

export { Good }
