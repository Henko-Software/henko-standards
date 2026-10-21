import { demoMock } from 'data/demo/mockAdapter'

const Bad = () => (
	<div style={{ color: '#ff0000' }}>
		<button className='bg-[#123456]'>Hola</button>
		{demoMock.length}
	</div>
)

export default Bad
