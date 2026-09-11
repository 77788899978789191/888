//! VM Module - 多态虚拟机引擎（22项技术）
//!
//! 包含VM-01到VM-22的全部虚拟机混淆技术实现。

pub mod seed_system;
pub mod core;
pub mod polymorphism;
pub mod codegen;

pub use seed_system::RandomSeedSystem;
pub use core::{
    BaseOpcode, InstructionLayout, OpcodeMapping, ParamOrder,
    SwitchInterpreter, TableInterpreter, VMConstant, VMInstruction, VMProgram,
};
pub use polymorphism::*;
pub use codegen::VMCodeGenerator;

/// VM技术数量
pub const VM_TECHNIQUE_COUNT: usize = 22;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vm_technique_count() {
        assert_eq!(VM_TECHNIQUE_COUNT, 22);
    }
}
